import { Component } from '@angular/core';
import {IonicPage, LoadingController, NavController, NavParams} from 'ionic-angular';
import {ToastService} from "../../services/toast.service";
import {ApiService} from "../../services/api.service";
import {RepoItem} from "../../classes/repo";
import {NodesPage, PageInfo} from "../../classes/nodes-page";
import {RepoPage} from "../repo/repo";


@IonicPage()
@Component({
  selector: 'page-repo-list',
  templateUrl: 'repo-list.html',
})
abstract class RepoListPage {
  title:string='Repo List';
  showOwnerLogin:boolean=false;
  showSearchBox:boolean=false;

  searchText:string;
  totalCount:number;
  pageInfo:PageInfo;
  repos:RepoItem[]=[];
  login:string;

  constructor(
    protected navCtrl: NavController,
    protected navParams: NavParams,
    protected apiSvc: ApiService,
    protected loadingCtrl: LoadingController,
    protected toastSvc: ToastService,
  ) {
    this.login=navParams.get('login');
    this.searchText=navParams.get('searchText')||'';
  }

  ionViewWillLoad() {
    this.initRepos().catch(()=>{
      this.navCtrl.pop();
    });
  }

  startLoading(){
    let loading=this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Loading'
    });
    loading.present();
    return loading;
  }

  initRepos():Promise<null>{
    let loading=this.startLoading();
    this.repos=[];
    this.totalCount=0;
    return this.appendRepos().then(()=>{
      loading.dismiss();
    }).catch(()=>{
      loading.dismiss();
      this.toastSvc.toast('Fail to load repos');
      throw new Error();
    });
  }

  appendRepos():Promise<null>{
    return this.getRepos(this.pageInfo?this.pageInfo.endCursor:null).then(data=>{
      this.totalCount=data.totalCount;
      this.pageInfo=data.pageInfo;
      Array.prototype.push.apply(this.repos,data.nodes);
      // console.log(this.repos);
    });
  }

  abstract getRepos(cursor:string):Promise<NodesPage<RepoItem>>;

  viewRepo(repo:RepoItem){
    this.navCtrl.push(RepoPage,{
      'ownerLogin':repo.owner.login,
      'name':repo.name
    });
  }

  doSearch(){}

}


export class StarredReposPage extends RepoListPage {
  title='Starred Repos';
  showOwnerLogin=true;

  getRepos(cursor:string){
    return this.apiSvc.getStarredRepos(this.login,cursor);
  }
}


export class OwnedReposPage extends RepoListPage {
  title='Owned Repos';

  getRepos(cursor:string){
    return this.apiSvc.getOwnedRepos(this.login,cursor);
  }
}



export class HotReposPage extends RepoListPage {
  title='Hot Repos';
  showSearchBox=true;
  showOwnerLogin=true;

  getRepos(cursor:string){
    return this.apiSvc.getHotRepos();
  }

  doSearch(){
    this.navCtrl.push(SearchReposPage,{
      'searchText': this.searchText
    });
  }
}


export class SearchReposPage extends RepoListPage {
  title='Search Repos';
  showSearchBox=true;
  showOwnerLogin=true;

  getRepos(){
    return this.apiSvc.searchRepos(this.searchText);
  }

  initRepos(){
    let loading=this.startLoading();
    this.repos=[];
    this.totalCount=0;
    return this.appendRepos().then(()=>{
      loading.dismiss();
    }).catch(()=>{
      loading.dismiss();
      this.toastSvc.toast('Search failed');
      throw new Error();
    });
  }

  doSearch(){
    this.initRepos().catch(()=>{});
  }

}
